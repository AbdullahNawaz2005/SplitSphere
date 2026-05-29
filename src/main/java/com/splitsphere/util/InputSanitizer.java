package com.splitsphere.util;

public final class InputSanitizer {

    private InputSanitizer() {
    }

    public static String cleanText(String value) {
        if (value == null) {
            return null;
        }
        return value.trim()
                .replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "")
                .replace("<", "")
                .replace(">", "");
    }
}
