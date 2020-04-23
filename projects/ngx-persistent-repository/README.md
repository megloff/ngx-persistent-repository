# NgxPersistentRepository

A persistent repository for storing basic key-value pairs to be used in Angular project providing a global and component specific namespaces.

There is no need for a database as the persistent data is stored in a browser cookie. 
However, if needed, the repository can be initialized with values from any database.
There are various hooks to synchronize the repository with the database.

## Installation

`npm install ngx-persistent-repository`

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


## Running unit tests

Run `ng test ngx-persistent-repository` to execute the unit tests via [Karma](https://karma-runner.github.io).
