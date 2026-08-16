import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiGatewayService } from '../../services/ai-gateway.service';

interface ConsoleMessage {
  sender: 'user' | 'gateway' | 'system';
  text: string;
}

@Component({
  selector: 'app-agent-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="terminal-container">
      <div class="terminal-header">
        <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
        <span class="title">aq-architect // LangGraph Agentic Pipeline Interface</span>
      </div>
      
      <div class="console-log">
        <div *ngFor="let msg of logs" [ngClass]="msg.sender">
          <span class="prefix">[{{msg.sender.toUpperCase()}}]:</span> {{msg.text}}
        </div>
        <div *ngIf="loading" class="system blink">⏳ Awaiting distributed system execution paths...</div>
      </div>

      <div class="input-panel">
        <input [(ngModel)]="userPrompt" (keyup.enter)="submitQuery()" placeholder="Instruct your multi-agent workforce loop..." [disabled]="loading" />
        <button (click)="submitQuery()" [disabled]="loading">Execute</button>
      </div>
    </div>
  `,
  styles: [`
    .terminal-container { background: #1a1b26; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: 'Courier New', monospace; margin: 20px auto; max-width: 800px; overflow: hidden; }
    .terminal-header { background: #24283b; padding: 10px; display: flex; align-items: center; border-bottom: 1px solid #414868; }
    .dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; display: inline-block; }
    .red { background: #f7768e; } .yellow { background: #e0af68; } .green { background: #9ece6a; }
    .title { color: #a9b1d6; font-size: 13px; margin-left: 10px; }
    .console-log { height: 350px; padding: 15px; overflow-y: auto; color: #c0caf5; font-size: 14px; line-height: 1.5; }
    .user { color: #7aa2f7; } .gateway { color: #9ece6a; } .system { color: #bb9af7; }
    .prefix { font-weight: bold; margin-right: 5px; }
    .input-panel { display: flex; border-top: 1px solid #414868; background: #24283b; }
    input { flex: 1; background: transparent; border: none; padding: 15px; color: #c0caf5; font-family: inherit; font-size: 14px; outline: none; }
    button { background: #414868; border: none; color: #9ece6a; padding: 0 25px; font-family: inherit; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #565f89; }
    .blink { animation: blinker 1.5s linear infinite; }
    @keyframes blinker { 50% { opacity: 0; } }
  `]
})
export class AgentTerminalComponent {
  userPrompt = '';
  loading = false;
  logs: ConsoleMessage[] = [
    { sender: 'system', text: 'Ecosystem layers online. Ready for automated prompt ingestion loops.' }
  ];

  constructor(private aiService: AiGatewayService) {}

  submitQuery() {
    if (!this.userPrompt.trim() || this.loading) return;

    const query = this.userPrompt;
    this.logs.push({ sender: 'user', text: query });
    this.userPrompt = '';
    this.loading = true;

    this.aiService.dispatchAgentPrompt(query).subscribe({
      next: (res) => {
        // Output each processing agent step sequentially
        res.data.pipeline_history.forEach(historyLog => {
          this.logs.push({ sender: 'gateway', text: historyLog });
        });
        this.loading = false;
      },
      error: (err) => {
        const status = err?.status || err?.statusCode;
        const hint =
          status === 401
            ? ' (Vercel Deployment Protection is likely ON — disable it in Project Settings, or use the Production domain)'
            : '';
        this.logs.push({
          sender: 'system',
          text: `Gateway communication failure: ${err.message}${hint}`,
        });
        this.loading = false;
      }
    });
  }
}
