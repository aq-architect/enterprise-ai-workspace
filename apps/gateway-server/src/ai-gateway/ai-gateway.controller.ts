import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import axios from 'axios';
import {
  ChatProxyDto,
  GatewayDispatchResponseDto,
} from './dto/chat-proxy.dto';

@ApiTags('AI Gateway')
@Controller('api/v1/gateway/agent')
export class AiGatewayController {
  private readonly aiCoreUrl: string;

  constructor(private configService: ConfigService) {
    this.aiCoreUrl =
      this.configService.get<string>('AI_CORE_URL') ||
      'http://localhost:8000/api/v1/agent/chat';
  }

  @Post('dispatch')
  @ApiOperation({
    summary: 'Dispatch prompt to AI agent core',
    description:
      'Validates the client prompt and proxies it to the Python FastAPI / LangGraph agent-core service.',
  })
  @ApiBody({ type: ChatProxyDto })
  @ApiOkResponse({
    description: 'Agent core response wrapped by the gateway',
    type: GatewayDispatchResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Missing prompt in request body' })
  @ApiBadGatewayResponse({ description: 'Agent core is unreachable' })
  async proxyToAiAgent(
    @Body() payload: ChatProxyDto,
  ): Promise<GatewayDispatchResponseDto> {
    if (!payload.prompt) {
      throw new HttpException(
        'Missing parameter context string: prompt',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await axios.post(this.aiCoreUrl, {
        prompt: payload.prompt,
      });
      return {
        source: '@aq-architect/gateway-server',
        gatewayStatus: 'synchronized',
        data: response.data,
      };
    } catch (error: any) {
      throw new HttpException(
        `AI Core communication failure: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
