# 해피니스 어드민 백엔드

Python Flask로 작성된 REST API 서버입니다.

## 설치

```bash
pip install -r requirements.txt
```

## 실행

```bash
python app.py
```

서버는 http://localhost:8081 에서 실행됩니다.

## API 엔드포인트

- GET `/api/admin/hello` - Hello World 메시지 반환
- GET `/health` - 서버 상태 확인
