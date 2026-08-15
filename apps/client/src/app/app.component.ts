import { Component } from '@angular/core';
import { AgentTerminalComponent } from './components/agent-terminal/agent-terminal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AgentTerminalComponent],
  template: `
    <main style="padding: 20px; text-align: center; background: #15161e; min-height: 100vh;">
      <h1 style="color: #c0caf5; font-family: sans-serif; font-weight: 300;">Enterprise AI Workspace</h1>
      <p style="color: #565f89; font-family: sans-serif; margin-bottom: 30px;">Angular 17 Control Panel Orchestrating Multi-Agent Microservices</p>
      <app-agent-terminal></app-agent-terminal>
    </main>
  `
})
export class AppComponent {}
