package com.happiness.admin.service;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.ThinkingConfigDisabled;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.happiness.admin.dto.AiTriageRunResultDto;
import com.happiness.admin.entity.Report;
import com.happiness.admin.repository.MemberRepository;
import com.happiness.admin.repository.PhotoRepository;
import com.happiness.admin.repository.ReportRepository;
import com.happiness.admin.repository.SeriesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

/**
 * 신고 트리아지 AI 어시스트 — 요약·심각도·참고용 조치 제안까지만 담당한다.
 * 실제 상태 전환은 AdminReportService.process()를 통해 관리자가 직접 실행한다(경계선은
 * docs/planning/AX_REPORT_TRIAGE_PLAN.md §3 참고).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminReportAiTriageService {

    private static final Set<String> ALLOWED_SEVERITIES = Set.of("LOW", "MEDIUM", "HIGH");
    private static final Set<String> ALLOWED_ACTIONS =
            Set.of("DISMISS", "HIDE_CONTENT", "DELETE_CONTENT", "WARN_AUTHOR", "SUSPEND_AUTHOR");
    private static final int MAX_SUMMARY_LENGTH = 500;

    private static final String SYSTEM_PROMPT = """
            너는 사진 커뮤니티 플랫폼의 콘텐츠 신고를 1차 검토하는 보조 도구다.
            신고 내용을 요약하고, 정책 위반 가능성을 평가해 관리자의 판단을 돕는다.
            최종 결정(콘텐츠 삭제, 회원 정지 등 실제 조치)은 반드시 사람 관리자가 내린다 —
            너는 판단을 돕는 요약과 제안만 제공하며 어떤 조치도 직접 실행하지 않는다.
            반드시 아래 JSON 형식으로만 응답하라. 다른 설명, 마크다운, 코드펜스를 포함하지 마라.
            {"summary": "2문장 이내 한국어 요약", "severity": "LOW 또는 MEDIUM 또는 HIGH", "suggestedAction": "DISMISS 또는 HIDE_CONTENT 또는 DELETE_CONTENT 또는 WARN_AUTHOR 또는 SUSPEND_AUTHOR 중 하나"}
            """;

    private final ReportRepository reportRepository;
    private final PhotoRepository photoRepository;
    private final MemberRepository memberRepository;
    private final SeriesRepository seriesRepository;
    private final ReportAiTriageWriter writer;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private AnthropicClient client;

    // 빈 등록 시점이 아니라 실제 호출 시점에 생성 — ANTHROPIC_API_KEY가 없는 개발 환경에서도
    // 서버 기동 자체는 실패하지 않게 한다 (기획서 §4.2).
    private synchronized AnthropicClient client() {
        if (client == null) {
            client = AnthropicOkHttpClient.fromEnv();
        }
        return client;
    }

    public AiTriageRunResultDto runBatch(int limit) {
        List<Report> targets = reportRepository.findPendingWithoutAiTriage(PageRequest.of(0, limit));
        int succeeded = 0;
        int failed = 0;
        for (Report report : targets) {
            try {
                TriageResult result = analyze(report);
                writer.save(report.getId(), result.summary(), result.severity(), result.suggestedAction());
                succeeded++;
            } catch (Exception e) {
                log.warn("AI 신고 트리아지 실패 - reportId={}", report.getId(), e);
                failed++;
            }
        }
        return AiTriageRunResultDto.builder()
                .requested(targets.size())
                .succeeded(succeeded)
                .failed(failed)
                .build();
    }

    private TriageResult analyze(Report report) {
        String userPrompt = """
                [신고 사유] %s
                [신고 상세] %s
                [신고 대상 유형] %s
                [신고 대상 정보]
                %s
                """.formatted(
                report.getReason(),
                report.getDetails() != null ? report.getDetails() : "(없음)",
                report.getTargetType(),
                describeTarget(report)
        );

        MessageCreateParams params = MessageCreateParams.builder()
                .model("claude-opus-5")
                .maxTokens(500L)
                .thinking(ThinkingConfigDisabled.builder().build())
                .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.LOW).build())
                .system(SYSTEM_PROMPT)
                .addUserMessage(userPrompt)
                .build();

        Message response = client().messages().create(params);
        String text = response.content().stream()
                .flatMap(block -> block.text().stream())
                .map(textBlock -> textBlock.text())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("AI 응답에 텍스트 블록이 없습니다."));

        return parse(text);
    }

    private TriageResult parse(String rawText) {
        String json = rawText.trim();
        if (json.startsWith("```")) {
            json = json.replaceFirst("^```(json)?", "").replaceFirst("```\\s*$", "").trim();
        }

        JsonNode node;
        try {
            node = objectMapper.readTree(json);
        } catch (Exception e) {
            throw new IllegalStateException("AI 응답 JSON 파싱 실패: " + rawText, e);
        }

        String summary = node.path("summary").asText(null);
        String severity = node.path("severity").asText(null);
        String suggestedAction = node.path("suggestedAction").asText(null);

        if (summary == null || summary.isBlank() || summary.length() > MAX_SUMMARY_LENGTH) {
            throw new IllegalStateException("AI 요약이 비었거나 허용 길이를 초과했습니다.");
        }
        if (!ALLOWED_SEVERITIES.contains(severity)) {
            throw new IllegalStateException("허용되지 않은 severity 값: " + severity);
        }
        if (!ALLOWED_ACTIONS.contains(suggestedAction)) {
            throw new IllegalStateException("허용되지 않은 suggestedAction 값: " + suggestedAction);
        }
        return new TriageResult(summary, severity, suggestedAction);
    }

    private String describeTarget(Report report) {
        return switch (report.getTargetType()) {
            case "PHOTO" -> photoRepository.findById(report.getTargetId())
                    .map(p -> "사진 제목: %s\n설명: %s".formatted(p.getTitle(), nullToDash(p.getDescription())))
                    .orElse("(대상 사진을 찾을 수 없음 - 삭제되었을 수 있음)");
            case "MEMBER" -> memberRepository.findById(report.getTargetId())
                    .map(m -> "회원 이름: %s\n상태: %s".formatted(m.getName(), m.getStatus()))
                    .orElse("(대상 회원을 찾을 수 없음 - 탈퇴했을 수 있음)");
            case "SERIES" -> seriesRepository.findById(report.getTargetId())
                    .map(s -> "시리즈 제목: %s\n설명: %s".formatted(s.getTitle(), nullToDash(s.getDescription())))
                    .orElse("(대상 시리즈를 찾을 수 없음 - 삭제되었을 수 있음)");
            default -> "(알 수 없는 대상 유형)";
        };
    }

    private String nullToDash(String value) {
        return (value == null || value.isBlank()) ? "-" : value;
    }

    private record TriageResult(String summary, String severity, String suggestedAction) {}
}
