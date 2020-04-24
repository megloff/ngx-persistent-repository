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
    "ngx-cookie-service": "^3.0.0",
    "lodash": "^4.0.0",
    "lzutf8": "^0.5.5",
	"stream": "^0.0.2"


## Usage

In your `module.ts` file:
 ```
...
import { PersistentRepositoryService } from 'ngx-persistent-repository';
...
@NgModule({
    ...
    providers: [..., PersistentRepositoryService, ...],
    ...
);
...
```

Let your component inherit from `PersistentRepositoryComponent` to use component specific namespaces this like:
```
...
import { PersistentRepositoryComponent } from 'ngx-persistent-repository';
...
export class YourComponent extends PersistentRepositoryComponent implements ... {
...
constructor(private repository: PersistentRepositoryService, ...) {
...
}
``` 

## Example/Demo

A simple Example can be found under src/app directory of the repository. Use `ng serve` to start the demo.


## API Documentation

Sadly, this still missing... please be patient or enjoy experimenting :-)
