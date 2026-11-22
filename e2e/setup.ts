// What a Superset frontend does before loading presets: configure the translator. Superset master's
// translator is @apache-superset/core's (the plugins' `t`); the older @superset-ui/core one is kept
// for the published 0.20 packages the harness draws with.
import { configure as configureCore } from '@apache-superset/core/translation';
import { configure } from '@superset-ui/core';

configureCore();
configure();
