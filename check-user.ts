
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './src/entities/User.entity';
import { Repository } from 'typeorm';

async function checkUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  
  const email = 'sojda018@gmail.com';
  const username = 'sojda018@gmail.com';
  
  const userByEmail = await userRepository.findOne({ where: { email } });
  const userByUsername = await userRepository.findOne({ where: { username } });
  
  console.log('User by email:', userByEmail ? 'Found' : 'Not Found');
  console.log('User by username:', userByUsername ? 'Found' : 'Not Found');
  
  await app.close();
}

checkUser();
