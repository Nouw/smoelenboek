"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtototoPredictionResults = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const ProtototoSeason_1 = require("./ProtototoSeason");
let ProtototoPredictionResults = class ProtototoPredictionResults {
};
exports.ProtototoPredictionResults = ProtototoPredictionResults;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProtototoPredictionResults.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.predictionResults),
    __metadata("design:type", Object)
], ProtototoPredictionResults.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ProtototoSeason_1.ProtototoSeason, season => season.predictionResults, { onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], ProtototoPredictionResults.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ProtototoPredictionResults.prototype, "points", void 0);
exports.ProtototoPredictionResults = ProtototoPredictionResults = __decorate([
    (0, typeorm_1.Entity)()
], ProtototoPredictionResults);
//# sourceMappingURL=ProtototoPredictionResults.js.map