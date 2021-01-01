const format = require('pg-format')
import Connection, { IOptions } from '../Connection'
import IQueryBuilder from '../IQueryBuilder'
import { IWhere, IWhereConfig, IJoin } from '../IQueryBuilder'
import { disconnect, getConnection } from './Connection'
import QueryType from '../../modules/enums/QueryTypes'

interface IQuery
{
    with?: {
        name: string,
        recursive?: boolean,
        query: string,
    },
    whereConfig: IWhereConfig
    where: IWhere[]
    returning: string[]
}

interface IQuerySelect
{
    distinct: boolean
    select: string[]
    orderBy: string[]
    joins: IJoin[]
    limit?: number
    offset?: number
}

interface IQueryInsert
{
    columns: string[]
    values: any[]
}

interface IInsertOptions
{
    multiple: boolean
}

interface IResult
{
    rows: any[]
}

export default class Postgres extends Connection
{
    _isConnected = false

    query: IQuery = {
        with: undefined,
        whereConfig: {
            condition: 'AND',
            operator: '=',
        },
        where: [],
        returning: [],
    }

    querySelect: IQuerySelect = {
        distinct: false,
        select: [],
        orderBy: [],
        joins: [],
    }

    queryInsert: IQueryInsert = {
        columns: [],
        values: [],
    }

    queryUpdate = {
        set: {},
    }

    queryDelete = {
        table: '',
        where: [],
    }

    constructor(options: IOptions)
    {
        super(options)
    }

    // <editor-fold desc="Connection Methods">

    clearConnection()
    {
        // if (this._connection)
        //     this.disconnect()
        super.clearConnection()
    }

    connect(): boolean
    {
        this.restartConnection()

        try
        {
            this._connection.connect((err: any, client: any, release: () => void) =>
            {
                if (err)
                {
                    this._isConnected = false
                    return console.error('Error acquiring client', err.stack)
                }
                client.query('SELECT NOW()', (err2: any) =>
                {
                    release()
                    if (err2)
                    {
                        this._isConnected = false
                        return console.error('Error executing query', err2.stack)
                    }
                    this._isConnected = true
                })
            })

            return true
        }
        catch (e)
        {
            console.error(e)
            this._isConnected = false
            return false
        }
    }

    isConnected(): boolean
    {
        return this._isConnected
    }

    disconnect(): boolean
    {
        return disconnect()
    }

    restartConnection(): void
    {
        this.clearConnection()
        this._connection = getConnection(this.options)
    }

    // </editor-fold>

    // <editor-fold desc="Queries Methods">

    table(tableName: string): IQueryBuilder
    {
        // @ts-ignore
        // const _this = global.clone(this)
        this._table = tableName
        return this
    }

    get(): Promise<any[]>
    {
        return this.raw(this.getQuery(QueryType.SELECT))
            .then((res: IResult) => this.parseResultQuery(res))
    }

    first(): Promise<Record<string, any>>
    {
        return this.raw(this.getQuery(QueryType.SELECT))
            .then((res: IResult) =>
            {
                const items = this.parseResultQuery(res)
                if (items.length)
                    return items[ 0 ]
            })
    }

    select(...args: string[]): IQueryBuilder
    {
        args.forEach(item => this.querySelect.select.push(item))
        return this
    }

    distinct(status: boolean): IQueryBuilder
    {
        this.querySelect.distinct = status
        return this
    }

    whereConfig(config: IWhereConfig): IQueryBuilder
    {
        // @ts-ignore
        Object.keys(config).forEach(key => this.query.whereConfig[ key ] = config[ key ])
        return this
    }

    where(...args: IWhere[]): IQueryBuilder
    {
        args.forEach(item => this.query.where.push(item))
        return this
    }

    whereSimple(wheres: Record<string, any>): IQueryBuilder
    {
        Object.keys(wheres).forEach(key =>
        {
            if (Array.isArray(wheres[ key ]))
                wheres[ key ].forEach((value: any) => this.query.where.push({ key, value, condition: 'OR' }))
            else
                this.query.where.push({ key, value: wheres[ key ] })
        })
        return this
    }

    returning(...args: string[]): IQueryBuilder
    {
        args.forEach(item => this.query.returning.push(item))
        return this
    }

    with(name: string, query: string, recursive?: boolean): IQueryBuilder
    {
        this.query.with = { name, recursive, query }
        return this
    }

    orderBy(...args: string[]): IQueryBuilder
    {
        args.forEach(item => this.querySelect.orderBy.push(item))
        return this
    }

    offset(count: number): IQueryBuilder
    {
        this.querySelect.offset = count
        return this
    }

    limit(count: number): IQueryBuilder
    {
        this.querySelect.limit = count
        return this
    }

    skip(count: number): IQueryBuilder
    {
        this.querySelect.offset = count
        return this
    }

    take(count: number): IQueryBuilder
    {
        this.querySelect.limit = count
        return this
    }

    join(keyA: string, operation: string, keyB: string, type = 'INNER'): IQueryBuilder
    {
        this.querySelect.joins.push({
            type,
            keyA,
            operation,
            keyB,
        })
        return this
    }

    innerJoin(keyA: string, operation: string, keyB: string): IQueryBuilder
    {
        return this.join(keyA, operation, keyB, 'INNER')
    }

    leftJoin(keyA: string, operation: string, keyB: string): IQueryBuilder
    {
        return this.join(keyA, operation, keyB, 'LEFT')
    }

    rightJoin(keyA: string, operation: string, keyB: string): IQueryBuilder
    {
        return this.join(keyA, operation, keyB, 'RIGHT')
    }

    fullJoin(keyA: string, operation: string, keyB: string): IQueryBuilder
    {
        return this.join(keyA, operation, keyB, 'FULL')
    }

    insert(items: Record<string, any>, options?: IInsertOptions): any
    {
        if (options?.multiple)
        {
            this.queryInsert.columns = items.columns

            items.values.forEach((item: (Record<string, any> | [])) =>
            {
                if (Array.isArray(item))
                    this.queryInsert.values.push(item)
                else
                    this.queryInsert.values.push(this.queryInsert.columns.map(column => item[ column ]))
            })

            if (Array.isArray(items.returning))
                this.query.returning = items.returning
        }
        else
        {
            this.queryInsert.columns = Object.keys(items)
            this.queryInsert.values.push(Object.values(items))
        }

        return this.raw(this.getQuery(QueryType.INSERT))
            .then((res: IResult) => this.parseResultQuery(res))
    }

    update(items: Record<string, any>): Promise<any>
    {
        this.queryUpdate.set = items

        return this.raw(this.getQuery(QueryType.UPDATE))
            .then((res: IResult) => this.parseResultQuery(res))
    }

    delete(): Promise<any>
    {
        return this.raw(this.getQuery(QueryType.DELETE))
            .then((res: IResult) => this.parseResultQuery(res))
    }

    // </editor-fold>

    // <editor-fold desc="Executor Methods">

    getQuery(type: QueryType = QueryType.SELECT): string
    {
        function getWithQuery(withQuery: any)
        {
            if (withQuery)
                return `WITH ${ withQuery.recursive ? 'recursive ' : '' } ${ withQuery.name } AS (${ withQuery.query }) `
            return ''
        }

        function getJoins(joins: IJoin[])
        {
            return joins.map(item => `${ item.type } JOIN ON ${ item.keyA } ${ item.operation } ${ item.keyB }`).join(' ')
        }

        const whereConfig = this.query.whereConfig
        function getWhere(where: IWhere[])
        {
            if (where.length)
            {
                const whereResult = where.map((item: IWhere, index) => `${ item.key } ${ item.operator || whereConfig.operator } ${ item.isStringFormat === undefined || item.isStringFormat ? format('%L', item.value) : item.value }${ index + 1 < where.length ? ` ${ item.condition || whereConfig.condition }` : '' }`).join(' ')
                return `WHERE ${ whereResult }`
            }
            return ''
        }

        function getOrderBy(orderBy: string[])
        {
            if (orderBy.length)
                return `ORDER BY ${ orderBy.join(', ') }`
            return ''
        }

        function getLimitOffset(limit: (string|number) = 'ALL', offset: (string|number) = 0)
        {
            return `LIMIT ${ limit }${ offset ? ` OFFSET ${ offset }` : '' }`
        }

        let query = ''

        switch (type)
        {
            case QueryType.SELECT:

                query = format(
                    '%sSELECT %s%s FROM %s %s %s %s %s',
                    getWithQuery(this.query.with),
                    this.querySelect.distinct ? 'DISTINCT ' : '',
                    this.querySelect.select.length ? this.querySelect.select.join(', ') : '*',
                    this._table,
                    getJoins(this.querySelect.joins),
                    getWhere(this.query.where),
                    getOrderBy(this.querySelect.orderBy),
                    getLimitOffset(this.querySelect.limit, this.querySelect.offset),
                )

                break

            case QueryType.INSERT:

                query = format(
                    'INSERT INTO %s (%s) VALUES %L returning %s',
                    this._table,
                    this.queryInsert.columns.join(', '),
                    this.queryInsert.values,
                    this.query.returning.length ? this.query.returning.join(', ') : 'id',
                )

                break

            case QueryType.UPDATE:

                query = format(
                    'UPDATE %s SET %s %s RETURNING %s',
                    this._table,
                    Object.entries(this.queryUpdate.set).map(item => `${ item[0] } = ${ format('%L', item[1]) }`).join(', '),
                    getWhere(this.query.where),
                    this.query.returning.length ? this.query.returning.join(', ') : 'id',
                )

                break

            case QueryType.DELETE:

                query = format(
                    'DELETE FROM %s %s RETURNING %s',
                    this._table,
                    getWhere(this.query.where),
                    this.query.returning.length ? this.query.returning.join(', ') : 'id',
                )

                break
        }

        return query
    }

    raw(query: string): Promise<any>
    {
        this.restartConnection()
        return new Promise((resolve, reject) =>
        {
            this._connection.query(query, (err: any, result: any) =>
            {
                if (err)
                {
                    this._isConnected = false
                    reject(err)
                    return console.error('Error executing query => ', err.stack)
                }
                else
                {
                    resolve(result)
                }
            })
        })
    }

    parseResultQuery(result: IResult): any[]
    {
        return result.rows
    }

    // </editor-fold>

    // <editor-fold desc="Debugging Methods">

    logger(): any
    {
        //
    }

    // </editor-fold>
}
