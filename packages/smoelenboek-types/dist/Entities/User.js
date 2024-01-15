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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const Role_1 = require("./Role");
const UserTeamSeason_1 = require("./UserTeamSeason");
const UserCommitteeSeason_1 = require("./UserCommitteeSeason");
const ProtototoPredictionResults_1 = require("./ProtototoPredictionResults");
const ProtototoPredictions_1 = require("./ProtototoPredictions");
const Activity_1 = require("./Activity");
let User = exports.User = class User {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ select: false }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "streetName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "houseNumber", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "postcode", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "bankaccountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], User.prototype, "birthDate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "bondNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], User.prototype, "joinDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "leaveDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], User.prototype, "backNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: "user/default.jpg" }),
    __metadata("design:type", String)
], User.prototype, "profilePicture", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: "text" }),
    __metadata("design:type", String)
], User.prototype, "refereeLicense", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Role_1.Role, (role) => role.user),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Object)
], User.prototype, "roles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserTeamSeason_1.UserTeamSeason, (userTeam) => userTeam.user),
    __metadata("design:type", Object)
], User.prototype, "userTeamSeason", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserCommitteeSeason_1.UserCommitteeSeason, (userCommittee) => userCommittee.user),
    __metadata("design:type", Object)
], User.prototype, "userCommitteeSeason", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProtototoPredictionResults_1.ProtototoPredictionResults, (predictionResult) => predictionResult.user),
    __metadata("design:type", Object)
], User.prototype, "predictionResults", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProtototoPredictions_1.ProtototoPredictions, (prediction) => prediction.user),
    __metadata("design:type", Object)
], User.prototype, "predictions", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Activity_1.Activity),
    __metadata("design:type", Object)
], User.prototype, "activities", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)()
], User);
//# sourceMappingURL=User.js.map