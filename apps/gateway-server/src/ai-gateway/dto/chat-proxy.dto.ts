import { ApiProperty } from '@nestjs/swagger';

export class ChatProxyDto {
  @ApiProperty({
    description: 'Natural-language prompt forwarded to the AI agent core',
    example: 'Summarize the latest enterprise RAG pipeline status',
  })
  prompt!: string;
}

export class AgentCoreDataDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({
    type: [String],
    example: ['Analyzing prompt...', 'Final answer'],
  })
  pipeline_history!: string[];

  @ApiProperty({ example: 'Final answer' })
  final_output!: string;
}

export class GatewayDispatchResponseDto {
  @ApiProperty({ example: '@aq-architect/gateway-server' })
  source!: string;

  @ApiProperty({ example: 'synchronized' })
  gatewayStatus!: string;

  @ApiProperty({ type: AgentCoreDataDto })
  data!: AgentCoreDataDto;
}
