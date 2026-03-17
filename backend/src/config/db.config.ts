import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { envConfigService } from './env-config.service';

export const appDataSource = new DataSource({
    type: 'postgres',
    ...envConfigService.getTypeOrmConfig(),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrationsRun: false,
    migrationsTableName: 'migrations',
    migrations: [__dirname + '/../**/migrations/*{.ts,.js}'],
    namingStrategy: new SnakeNamingStrategy(),
});
