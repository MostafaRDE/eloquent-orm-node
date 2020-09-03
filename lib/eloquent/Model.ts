import ModelTypes from '../modules/enums/ModelTypes'
import DB from '../db/DB'

interface IModel
{
    /*
    |--------------------------------------------------------------------------
    | Static methods
    |--------------------------------------------------------------------------
    |
    | This option for create a model locally as simple way with your data.
    |
    | methods:
    |   create(),  insert(), update(), destroy(), withTrashed()
    |
    */

    // take(count: number)
    //
    // paginate(page: number, size: number)
    //
    // count(): number
    //
    // max(): number
    //
    // refresh()
    //
    // fill(data: object)
    //
    // save(): boolean
    //
    // delete(): boolean
    //
    // softDelete(): boolean
    //
    // forceDelete(): boolean
    //
    // restore(): boolean
    //
    // logger(): any
}

export default abstract class Model implements IModel
{
    /*
    |--------------------------------------------------------------------------
    | Model connection
    |--------------------------------------------------------------------------
    |
    | This option for create a model locally as simple way with your data.
    |
    */

    public connection: DB

    /*
    |--------------------------------------------------------------------------
    | Model create method
    |--------------------------------------------------------------------------
    |
    | This option for create a model locally as simple way with your data.
    |
    */

    public create()
    {
        //
    }

    /*
    |--------------------------------------------------------------------------
    | Model insert method
    |--------------------------------------------------------------------------
    |
    | This option for create a model physically as simple way with your data.
    |
    | Saved in database and retrieve model with your data.
    |
    */

    public insert()
    {
        //
    }

    /*
    |--------------------------------------------------------------------------
    | Model update method
    |--------------------------------------------------------------------------
    |
    | This option for update a model physically as simple way with your data.
    |
    | Updated row in your database with primary key in this model.
    |
    */

    public update()
    {
        //
    }

    /*
    |--------------------------------------------------------------------------
    | Model destroy method
    |--------------------------------------------------------------------------
    |
    | This option for delete a model physically as simple way with your
    | primary key(s).
    |
    | deleted row(s) in your database with primary key in this model.
    |
    */

    public destroy()
    {
        //
    }

    /*
    |--------------------------------------------------------------------------
    | Model trashed method
    |--------------------------------------------------------------------------
    |
    | This option for retrieve soft deleted rows from database.
    |
    */

    public trashed()
    {
        //
    }

    /*
    |--------------------------------------------------------------------------
    | Model withTrashed method
    |--------------------------------------------------------------------------
    |
    | This option for retrieve rows from database with softDeleted rows.
    |
    */

    public withTrashed()
    {
        //
    }

    ///////////////////////////////////////////

    protected tableType: ModelTypes = ModelTypes.table

    protected table = ''

    protected columns: Record<string, any>

    protected data: Record<string, any> = {}

    protected primaryKey: string|Array<string> = 'id'

    protected keyType: string|Array<string> = 'integer'

    protected dates: Array<string> = [ 'created_at', 'updated_at' ]

    protected dateFormat = 'U'

    protected timestamps = true

    protected fillable: Array<string> = []

    protected guarded: Array<string> = []

    protected hidden: Array<string> = []

    protected incrementing = true

    protected constructor(data: Record<string, any>)
    {
        this.connection = new DB()

        this.columns = Object.keys(this.data)
        this.data = data
    }


}
