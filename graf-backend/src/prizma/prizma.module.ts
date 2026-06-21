import { Global, Module } from '@nestjs/common';
import { PrizmaHubService } from './prizma-hub.service';

/**
 * Prizma ecosystem integration module.
 *
 * Global so any feature module can inject {@link PrizmaHubService} to publish
 * Hermes-owned events to Nous (Nous) without re-importing this module.
 */
@Global()
@Module({
  providers: [PrizmaHubService],
  exports: [PrizmaHubService],
})
export class PrizmaModule {}
