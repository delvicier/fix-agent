import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /* <--- Asegúrate de que esté comentado
  @Get()
  getHello(): string {s
    return this.appService.getHello();
  }
  */ // <-- O bórralo por completo
}
