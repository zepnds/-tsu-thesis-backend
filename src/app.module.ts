import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VisitorModule } from './visitor/visitor.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { StaffModule } from './staff/staff.module';
import { PlotModule } from './plot/plot.module';
import { CemeteryInfoModule } from './cemetery-info/cemetery-info.module';
import { GravesModule } from './graves/graves.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ReservationsModule } from './reservations/reservations.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { BurialRequestsModule } from './burial-requests/burial-requests.module';
import { UsersModule } from './users/users.module';
import { MailingModule } from './library/mailing/mailing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL') || '';
        console.log('--- DB URL IS:', dbUrl, '---');
        return {
          type: 'postgres',
          url: dbUrl,
          autoLoadEntities: true,
          synchronize: false, // We use existing DB, don't sync in prod
          logging: true,
          ssl: true,
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    VisitorModule,
    AuthModule,
    AdminModule,
    StaffModule,
    PlotModule,
    CemeteryInfoModule,
    GravesModule,
    InfrastructureModule,
    ReservationsModule,
    MaintenanceModule,
    BurialRequestsModule,
    UsersModule,
    MailingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
