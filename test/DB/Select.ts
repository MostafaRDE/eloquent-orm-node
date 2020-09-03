import con from '../Connection'

con.table('table_name').select('*').where({ key: 'id', value: 1 }).get().then(console.log)
con.table('table_name').select('*').whereSimple({ id: 1 }).get().then(console.log)

con.raw('SELECT NOW()').then((res: any) => console.log(res.rows))
