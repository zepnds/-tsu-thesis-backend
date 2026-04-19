import { Module, Global } from '@nestjs/common';
import { MailingService } from './mailing.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MailingService],
  exports: [MailingService],
})
export class MailingModule {}
