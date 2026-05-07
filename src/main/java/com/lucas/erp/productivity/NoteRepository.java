package com.lucas.erp.productivity;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteRepository extends JpaRepository<WorkspaceNote, Integer> {
}