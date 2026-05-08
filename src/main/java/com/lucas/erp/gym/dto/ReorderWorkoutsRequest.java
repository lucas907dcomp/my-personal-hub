package com.lucas.erp.gym.dto;

import java.util.List;
import java.util.UUID;

public record ReorderWorkoutsRequest(List<UUID> orderedIds) {}
