import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AiGatewayModule } from './ai-gateway/ai-gateway.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        'apps/gateway-server/.env',
        '.env',
      ],
    }),
    AuthModule,
    AiGatewayModule,
    EventsModule,
  ],
})
export class AppModule {}
