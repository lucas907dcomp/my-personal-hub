package com.lucas.erp.productivity;

public record WorkspaceNoteDTO(String content) {
    public static WorkspaceNoteDTO from(WorkspaceNote n) {
        return new WorkspaceNoteDTO(n.getContent() != null ? n.getContent() : "");
    }
}
