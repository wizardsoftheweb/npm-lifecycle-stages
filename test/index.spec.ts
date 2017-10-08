/* tslint:disable:no-console */
// Things like ...be.true; or ...be.rejected; dont play nice with TSLint
/* tslint:disable:no-unused-expression */
import * as chai from "chai";
// Needed for describe, it, etc.
import { } from "mocha";
import { EOL } from "os";
import * as proxyquire from "proxyquire";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

const should = chai.should();
chai.use(sinonChai);

import {
    ENpmLifecycleStages,
    NpmLifecycleStages,
} from "../src/index";

describe("index", (): void => {
    describe("NpmLifecycleStages", (): void => {
        it("should have elements", (): void => {
            NpmLifecycleStages.should.not.be.empty;
        });

        it("should have all the stages", (): void => {
            for (const stage in ENpmLifecycleStages) {
                if (ENpmLifecycleStages.hasOwnProperty(stage)) {
                    NpmLifecycleStages.indexOf(stage).should.be.greaterThan(-1);
                }
            }
        });
    });

    describe("ENpmLifecycleStages", (): void => {
        it("should have elements", (): void => {
            Object.keys(ENpmLifecycleStages).should.not.be.empty;
        });

        it("should have all the stages", (): void => {
            for (const stage of NpmLifecycleStages) {
                ENpmLifecycleStages[stage as any].should.equal(stage);
            }
        });
    });
});
