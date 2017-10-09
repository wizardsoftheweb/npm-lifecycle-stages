/* tslint:disable:no-unused-expression */
import * as chai from "chai";

const should = chai.should();

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
