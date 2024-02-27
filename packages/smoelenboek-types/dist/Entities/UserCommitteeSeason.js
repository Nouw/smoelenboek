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
exports.UserCommitteeSeason = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Committee_1 = require("./Committee");
const Season_1 = require("./Season");
let UserCommitteeSeason = exports.UserCommitteeSeason = class UserCommitteeSeason {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserCommitteeSeason.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], UserCommitteeSeason.prototype, "function", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.userCommitteeSeason, { onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], UserCommitteeSeason.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Committee_1.Committee, committee => committee.userCommitteeSeason, { onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], UserCommitteeSeason.prototype, "committee", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Season_1.Season, season => season.userCommitteeSeason),
    __metadata("design:type", Object)
], UserCommitteeSeason.prototype, "season", void 0);
exports.UserCommitteeSeason = UserCommitteeSeason = __decorate([
    (0, typeorm_1.Entity)()
], UserCommitteeSeason);
//# sourceMappingURL=UserCommitteeSeason.js.map