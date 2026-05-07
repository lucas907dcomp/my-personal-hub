package com.lucas.erp.productivity;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<WorkspaceNote, UUID> {
}
