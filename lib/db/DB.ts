import Drivers from '../modules/enums/Drivers'
import Connection from './Connection'
import { IOptions } from './Connection'
import IQueryBuilder from './IQueryBuilder'
import Postgres from './postgres/Postgres'

export default class DB implements IQueryBuilder
{
    private options: IOptions
    private readonly connection: Connection

    constructor(options: IOptions)
    {
        this.options = options

        switch (options.driver)
        {
            case Drivers.postgres:
                this.connection = new Postgres(options)
                break
        }
    }

    connectionChecker(): boolean
    {
        if (this.connection)
        {
            if (this.connection.isConnected())
                return true
            else
                throw ''
        }
        else
        {
            throw ''
        }
    }

    // <editor-fold desc="Queries Methods">

    parseResultQuery(result: any): Record<string, any>|[]
    {
        this.connection.parseResultQuery(result)
        return this
    }

    table(tableName: string): IQueryBuilder
    {
        const _this = global.clone(this)
        _this.connection.table(tableName)
        return _this
    }

    get(): Promise<[] | Record<string, any>>
    {
        return this.connection.get()
    }

    select(...args: string[]): IQueryBuilder
    {
        this.connection.select(...args)
        return this
    }

    distinct(status = true): IQueryBuilder
    {
        this.connection.distinct(status)
        return this
    }

    where(...args: {key: string, operator?: string, value: string, condition?: string}[]): IQueryBuilder
    {
        this.connection.where(...args)
        return this
    }

    orderBy(...args: string[]): IQueryBuilder
    {
        this.connection.orderBy(...args)
        return this
    }

    insert(items: Record<string, any>, options?: Record<string, any>): any
    {
        const _this = global.clone(this)
        return _this.connection.insert(items, options)
    }

    update(items: Record<string, any>, options?: Record<string, any>): boolean
    {
        const _this = global.clone(this)
        return _this.connection.update(items, options)
    }

    delete(): boolean
    {
        return false
    }

    // </editor-fold>

    // <editor-fold desc="Executor Methods">

    getQuery(): string
    {
        return this.connection.getQuery()
    }

    raw(query: string): any
    {
        return this.connection.raw(query)
    }

    // </editor-fold>

    // <editor-fold desc="Debugging Methods">

    logger(): any
    {
        //
    }

    // </editor-fold>
}
