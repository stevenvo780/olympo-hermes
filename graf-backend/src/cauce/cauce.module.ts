import { Global, Module } from '@nestjs/common';
import { CauceHubService } from './hub.service';

/**
 * Cauce ecosystem integration module.
 *
 * Global so any feature module can inject {@link CauceHubService} to publish
 * Graf-owned events to HubCentral without re-importing this module.
 */
@Global()
@Module({
  providers: [CauceHubService],
  exports: [CauceHubService],
})
export class CauceModule {}
