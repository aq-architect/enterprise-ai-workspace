import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { EventsService } from '../events/events.service';

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly eventsService: EventsService,
  ) {}

  async proxyChat(prompt: string, user: JwtPayload) {
    const baseUrl = this.configService.getOrThrow<string>('AGENT_CORE_BASE_URL');
    const chatPath = this.configService.get<string>(
      'AGENT_CORE_CHAT_PATH',
      '/api/v1/agent/chat',
    );
    const url = `${baseUrl.replace(/\/$/, '')}${chatPath}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, { prompt }),
      );

      await this.eventsService.publishAiEvent({
        type: 'ai.chat.completed',
        userId: user.sub,
        prompt,
        success: true,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to proxy chat to agent-core at ${url}`, error);

      await this.eventsService.publishAiEvent({
        type: 'ai.chat.failed',
        userId: user.sub,
        prompt,
        success: false,
        timestamp: new Date().toISOString(),
      });

      throw new BadGatewayException('Agent core is unavailable');
    }
  }
}
