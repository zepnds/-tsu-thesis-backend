import { Controller, Get, Param } from '@nestjs/common';
import { BurialRequestsService } from './burial-requests.service';

@Controller('api/burial-requests')
export class BurialRequestsController {
    constructor(private readonly service: BurialRequestsService) { }

    @Get(':family_contact')
    async getByContact(@Param('family_contact') familyContact: string) {
        return this.service.getByContact(familyContact);
    }
}
