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
exports.Role = exports.Roles = void 0;
const typeorm_1 = require("typeorm");
const Permission_1 = require("./Permission");
const User_1 = require("./User");
var Roles;
(function (Roles) {
    Roles[Roles["DEFAULT"] = 1] = "DEFAULT";
    Roles[Roles["ADMIN"] = 2] = "ADMIN";
    Roles[Roles["TEMP"] = 3] = "TEMP";
})(Roles = exports.Roles || (exports.Roles = {}));
let Role = class Role {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Role.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Role.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => User_1.User, (user) => user.roles),
    __metadata("design:type", Object)
], Role.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Permission_1.Permission, (permission) => permission.roles),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Object)
], Role.prototype, "permissions", void 0);
Role = __decorate([
    (0, typeorm_1.Entity)()
], Role);
exports.Role = Role;
//# sourceMappingURL=Role.js.map