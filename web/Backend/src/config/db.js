import knex from 'knex';

export default knex({
    client: 'pg',
    connection: {
        host: 'aws-1-ap-southeast-1.pooler.supabase.com',
        port: 5432,
        user: 'postgres.kbvtakjmfeefzvkbrwjj',
        password: 'Vuzdapoet1234',
        database: 'postgres'
    },
    
    pool: { min: 0, max: 10 },
});

