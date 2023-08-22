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
exports.ProtototoMatch = void 0;
const typeorm_1 = require("typeorm");
const ProtototoSeason_1 = require("./ProtototoSeason");
const ProtototoPredictions_1 = require("./ProtototoPredictions");
let ProtototoMatch = class ProtototoMatch {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProtototoMatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp" }),
    __metadata("design:type", Date)
], ProtototoMatch.prototype, "playDate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProtototoMatch.prototype, "homeTeam", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProtototoMatch.prototype, "awayTeam", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProtototoMatch.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProtototoMatch.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ProtototoSeason_1.ProtototoSeason, (season) => season.matches, { onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], ProtototoMatch.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProtototoPredictions_1.ProtototoPredictions, (prediction) => prediction.match),
    __metadata("design:type", Object)
], ProtototoMatch.prototype, "predictions", void 0);
ProtototoMatch = __decorate([
    (0, typeorm_1.Entity)()
], ProtototoMatch);
exports.ProtototoMatch = ProtototoMatch;
//# sourceMappingURL=ProtototoMatch.js.map