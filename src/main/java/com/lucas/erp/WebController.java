package com.lucas.erp;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller // Usamos @Controller e não @RestController, pois queremos retornar uma TELA e não um JSON
public class WebController {

    @GetMapping("/fuel")
    public String fuelHub() {
        // O comando 'forward:' diz para o Spring:
        // "Não mude a URL no navegador do usuário, apenas entregue o arquivo que está neste caminho interno".
        return "forward:/fuel/index.html";
    }

    @GetMapping("/productivity")
    public String productivityHub() {
        return "forward:/productivity/index.html";
    }

    @GetMapping("/gym")
    public String gymHub() {
        return "forward:/gym/index.html";
    }
}
