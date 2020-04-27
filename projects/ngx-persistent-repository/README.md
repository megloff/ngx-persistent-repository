# NgxPersistentRepository

A persistent repository for storing basic key-value pairs to be used in Angular project providing a global and component specific namespaces.

In many cases there is no need for a database as the persistent data is stored in a browser cookie. 
However, if the compressed repository exceeds maximal cookie size of 4KB, the persistent data must be held in a database. 

The API allows to initialize the repository with values from a database and provides hooks for synchronizing the repository with the database.

## Installation

`npm install ngx-persistent-repository`

## Dependencies

The packages below must be manually installed in order to use the persistent repository:

    "@angular/common": ">=6.0.0",
    "@angular/core": ">=6.0.0",
    "tslib": ">1.9.0",
    "ngx-cookie-service": "^2.4.0 || ^3.0.0",
    "lodash": "^4.0.0",
    "lzutf8": "^0.5.5",
    "stream": "^0.0.2"


## Global Repository Usage

In your `module.ts` file:
 ```
import { PersistentRepositoryService } from 'ngx-persistent-repository';

@NgModule({
    ...
    providers: [..., PersistentRepositoryService, ...],
    ...
);
```
To use the repository, simply inject `PersistentRepositoryService`  into your class.

## Component Repository Usage

If you want use a separate namespace in the repository for one of you components, let the component inherit from `PersistentRepositoryComponent`:
```
import { PersistentRepositoryComponent } from 'ngx-persistent-repository';

export class YourComponent extends PersistentRepositoryComponent implements ... {
    constructor() {
        super();
        ...
    }
    ...
}
``` 
You component will inherit all repository methods properly namespaced. To access the global repository use the protected
property `persistentRepository` or the public accessor `getPersistentRepository()`.  

## Example/Demo

A simple example can be found under src/app directory of the repository. Use `ng serve` to start the demo.

## API Documentation

You can find the `typedoc` documentation in the [/projects/ngx-persistent-repository/docs](/projects/ngx-persistent-repository/docs) folder of this repository.


## Tips and Tricks

### Cookies and Persistence

To actually enable the repository you must call the method `enableCookies()` or use the `enableCookies` option in your call to
`setOptions()`. The reason for this lies in the fact that you should normally ask the user's permission before you use cookies. So 
the usage pattern is to use status of your cookie-consent package to control cookie activation.

If you don't use a cookie-consent package you still need to call `enableCookies(true)` or use the respective option.

The default setup uses a cookie named 'ngx-persistent-repository' to store the repository data. The cookie will expire after 365 days.
Use the `cookieConfig` option for fully control the cookie parameters.   

### External Persistence Database

When using an external database to store the repository you need to provide a hook for reading data from the database (`setFetchPersistentDataHook()`)
and another hook for writing data to the database (`setWritePersistentDataHook()`).

Note that these hooks will only be used when you set a database handle via `setDatabaseHandle()`. The database handle can be something
like a user specific hash or user id. It will be passed to the hooks as reference to the correct dataset.

As soon as you clear the database handle, the repository persistence will revert to use the cookie. 

While changes to the repository are immediately visible and access to persistence data stored in cookies is 
instantaneous - access to external databases is not. It is therefore essential use the provides `Promise` return values if 
you need to be certain the data has been synchronized with the persistence database.

You can use the `updatePersistentDataImmediate()` to make sure the current repository data gets synchronized with the persistence database
like this:

    this.updatePersistentDataImmediate().then(() => {
        // now the repository and the external database are synchronous
    }).catch((error) => {
        // what ever you want to do in this case...
    });

A typical read hook looks like this:

    this.preferences.setFetchPersistentDataHook((databaseHandle: string) => {
        return new Promise<PRGenericValues>((resolve, reject) => {
            const params = new HttpParams({
                fromObject: {
                    hash: databaseHandle
                }
            });

            this.http.get("/user", {params: params}).toPromise().then((result: HttpReply) => {
                let prefs: PRGenericValues = {};
                if (result.success && result.user) {
                    try {
                        prefs = JSON.parse(atob(result.user.preferences)) || {};
                        this.user = result.user;
                    } catch (e) {
                        // ignore errors
                    }
                    resolve(prefs);
                } else {
                    resolve(prefs);
                }
            }).catch((error) => {
                console.error("error reading preferences", error);
            });
        });
    });

A matching write hook would then look like this:

    this.repository.setWritePersistentDataHook((databaseHandle: string, data: PRGenericValues) => {
        return new Promise<void>((resolve) => {
            const userPreferences: PRGenericValues = _.clone(data);

            const envelope: ClientSideUserModel = {
                hash: databaseHandle,
                preferences: btoa(JSON.stringify(userPreferences))
            };

            this.http.put("/user", envelope).toPromise().then((result: HttpReply) => {
                if (!result.success) {
                    console.warning("unable to write preferences", result);
                }
                resolve();
            }).catch((error) => {
                console.error("error writing preferences", error);
            });
        });
