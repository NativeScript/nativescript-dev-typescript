TypeScript support for NativeScript projects
=======================================

# How to use
----------
```
$ npm install -D nativescript-dev-typescript
```

The above command installs this module and installs the necessary hooks. TypeScript compilation happens when the project is prepared for build. A file named `tsconfig.json` that specifies compilation options will be created in the project folder and should be committed to source control.

# Note for plugins
----------
```
$ npm install -D nativescript-dev-typescript@libs
```

When developing NativeScript plugins, you should install the 'libs' tag of the nativescript-dev-typescript plugin. This will skip adding 'paths' mappings for 'tns-core-modules' in the 'tsconfig.json', because of this Angular compiler [issue](https://github.com/angular/angular-cli/issues/5618).
