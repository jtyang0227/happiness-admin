package com.happiness.admin.entity;

public enum MemberStatus {
    ACTIVE("활성"),
    INACTIVE("비활성"),
    SUSPENDED("정지"),
    DELETED("삭제됨");
    
    private final String label;
    
    MemberStatus(String label) {
        this.label = label;
    }
    
    public String getLabel() {
        return label;
    }
}
