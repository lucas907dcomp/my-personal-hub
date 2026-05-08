package com.lucas.erp.fuel;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/fuel")
@RequiredArgsConstructor
public class FuelController {

    private final FuelService fuelService;

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    @GetMapping
    public List<FuelRecordDTO> getRecords(@AuthenticationPrincipal Jwt jwt) {
        return fuelService.getRecords(userId(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FuelRecordDTO addRecord(@AuthenticationPrincipal Jwt jwt,
                                   @Valid @RequestBody CreateFuelRecordRequest request) {
        return fuelService.addRecord(userId(jwt), request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@AuthenticationPrincipal Jwt jwt,
                                             @PathVariable UUID id) {
        fuelService.deleteRecord(userId(jwt), id);
        return ResponseEntity.noContent().build();
    }
}
