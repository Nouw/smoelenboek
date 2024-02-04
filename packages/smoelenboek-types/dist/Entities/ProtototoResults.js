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
exports.ProtototoResults = void 0;
const typeorm_1 = require("typeorm");
const ProtototoMatch_1 = require("./ProtototoMatch");
let ProtototoResults = class ProtototoResults {
};
exports.ProtototoResults = ProtototoResults;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProtototoResults.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => ProtototoMatch_1.ProtototoMatch, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Object)
], ProtototoResults.prototype, "match", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], ProtototoResults.prototype, "setOne", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], ProtototoResults.prototype, "setTwo", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], ProtototoResults.prototype, "setThree", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], ProtototoResults.prototype, "setFour", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], ProtototoResults.prototype, "setFive", void 0);
exports.ProtototoResults = ProtototoResults = __decorate([
    (0, typeorm_1.Entity)()
], ProtototoResults);
//# sourceMappingURL=ProtototoResults.js.map