package com.happiness.admin.entity;

public enum Authority {
    WM("웹관리자"),      // 웹 관리자
    SA("운영자"),       // 서비스 관리자
    US("유저");         // 일반 사용자
    
    private final String label;
    
    Authority(String label) {
        this.label = label;
    }
    
    public String getLabel() {
        return label;
    }
}
