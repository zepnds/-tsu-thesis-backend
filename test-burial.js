const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { VisitorService } = require('./dist/src/visitor/visitor.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(VisitorService);
  
  try {
    const res = await service.burialRequestRepository.createQueryBuilder('burial')
      .leftJoinAndSelect('burial.plot', 'plot')
      .where('burial.family_contact = :userId::bigint', { userId: '21' })
      .getMany();
    console.log('SUCCESS QB::bigint', res.length);
  } catch (e) {
    console.error('ERROR QB::bigint', e.message);
  }

  try {
    const res = await service.burialRequestRepository.createQueryBuilder('burial')
      .leftJoinAndSelect('burial.plot', 'plot')
      .where('burial.family_contact = :userId', { userId: Number('21') })
      .getMany();
    console.log('SUCCESS QB Number', res.length);
  } catch (e) {
    console.error('ERROR QB Number', e.message);
  }

  await app.close();
}
bootstrap();
