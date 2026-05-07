package com.lucas.erp;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class GymControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    private static final UUID USER_A = UUID.randomUUID();
    private static final UUID USER_B = UUID.randomUUID();

    // T1: GET /api/gym/workouts with valid JWT → 200
    @Test
    void t1_getWorkouts_withValidJwt_returns200() throws Exception {
        mockMvc.perform(get("/api/gym/workouts")
                        .with(jwt().jwt(b -> b.subject(USER_A.toString()))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // T2: GET /api/gym/workouts without JWT → 401
    @Test
    void t2_getWorkouts_withoutJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/gym/workouts"))
                .andExpect(status().isUnauthorized());
    }

    // T3: Data isolation — user B cannot see user A's workouts
    @Test
    void t3_getWorkouts_differentUser_returnsEmptyArray() throws Exception {
        // Create a workout for user A
        String workoutJson = objectMapper.writeValueAsString(Map.of("name", "Treino A"));
        mockMvc.perform(post("/api/gym/workouts")
                        .with(jwt().jwt(b -> b.subject(USER_A.toString())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(workoutJson))
                .andExpect(status().isCreated());

        // User B should not see user A's workout
        mockMvc.perform(get("/api/gym/workouts")
                        .with(jwt().jwt(b -> b.subject(USER_B.toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.name == 'Treino A')]").doesNotExist());
    }

    // T4: POST /api/gym/workouts with valid JWT → 201, workout.userId == JWT sub
    @Test
    void t4_createWorkout_withValidJwt_returns201() throws Exception {
        String workoutJson = objectMapper.writeValueAsString(Map.of("name", "New Workout"));
        mockMvc.perform(post("/api/gym/workouts")
                        .with(jwt().jwt(b -> b.subject(USER_A.toString())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(workoutJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Workout"));
    }

    // T5: DELETE another user's workout → 404
    @Test
    void t5_deleteOtherUserWorkout_returns404() throws Exception {
        // Create workout for user A
        String workoutJson = objectMapper.writeValueAsString(Map.of("name", "Treino Owner"));
        String response = mockMvc.perform(post("/api/gym/workouts")
                        .with(jwt().jwt(b -> b.subject(USER_A.toString())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(workoutJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID workoutId = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        // User B tries to delete user A's workout
        mockMvc.perform(delete("/api/gym/workouts/" + workoutId)
                        .with(jwt().jwt(b -> b.subject(USER_B.toString()))))
                .andExpect(status().isNotFound());
    }

    // T6: GET /api/gym/supplements with valid JWT → 200, only user's data
    @Test
    void t6_getSupplements_withValidJwt_returns200() throws Exception {
        mockMvc.perform(get("/api/gym/supplements")
                        .with(jwt().jwt(b -> b.subject(USER_A.toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.whey").isBoolean())
                .andExpect(jsonPath("$.creatina").isBoolean());
    }
}
