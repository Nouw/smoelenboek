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
exports.UserTeamSeason = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Team_1 = require("./Team");
const Team_2 = require("../Enums/Team");
const Season_1 = require("./Season");
let UserTeamSeason = exports.UserTeamSeason = class UserTeamSeason {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserTeamSeason.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], UserTeamSeason.prototype, "function", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.userTeamSeason),
    __metadata("design:type", Object)
], UserTeamSeason.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Team_1.Team, team => team.userTeamSeason),
    __metadata("design:type", Object)
], UserTeamSeason.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Season_1.Season, season => season.userTeamSeason),
    __metadata("design:type", Object)
], UserTeamSeason.prototype, "season", void 0);
exports.UserTeamSeason = UserTeamSeason = __decorate([
    (0, typeorm_1.Entity)()
], UserTeamSeason);
//# sourceMappingURL=UserTeamSeason.js.map