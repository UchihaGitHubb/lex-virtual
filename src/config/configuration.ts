import { join } from 'path';

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    type: 'postgres',
    host: process.env.DB_HOST,
    entities: [join(__dirname, '**', '*.entity.{ts,js}')],
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    autoLoadEntities: true,
    synchronize: true,
    logging: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES,
  },
});
