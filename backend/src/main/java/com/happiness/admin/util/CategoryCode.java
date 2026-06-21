package com.happiness.admin.util;

public class CategoryCode {
    public static String[] parse(String code) {
        String c = (code == null || code.length() != 10) ? "0000000000" : code;
        return new String[]{c.substring(0,2), c.substring(2,4), c.substring(4,6), c.substring(6,8), c.substring(8,10)};
    }
    public static String setLevel(String code, int level, String newCode) {
        char[] c = (code == null || code.length() != 10 ? "0000000000" : code).toCharArray();
        int pos = (level - 1) * 2;
        c[pos] = newCode.charAt(0); c[pos+1] = newCode.charAt(1);
        return new String(c);
    }
    public static String getLevel(String code, int level) {
        if (code == null || code.length() < level * 2) return "00";
        return code.substring((level-1)*2, (level-1)*2+2);
    }
}
