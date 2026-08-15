import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GatewayResponse {
  source: string;
  gatewayStatus: string;
  data: {
    success: boolean;
    pipeline_history: string[];
    final_output: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AiGatewayService {
  private readonly gatewayUrl = 'http://localhost:3000/api/v1/gateway/agent/dispatch';

  constructor(private http: HttpClient) {}

  dispatchAgentPrompt(prompt: string): Observable<GatewayResponse> {
    return this.http.post<GatewayResponse>(this.gatewayUrl, { prompt });
  }
}
