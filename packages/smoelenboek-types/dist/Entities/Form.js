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
exports.Form = void 0;
const typeorm_1 = require("typeorm");
const Activity_1 = require("./Activity");
const FormQuestion_1 = require("./FormQuestion");
//TODO: Add some way to order the form
//TODO: Make startup script to check if everything is cascaded, because TypeORM is a bit retarded with that.
let Form = exports.Form = class Form {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Form.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Form.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Form.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Form.prototype, "sheetId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Activity_1.Activity, activity => activity.form, { onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], Form.prototype, "activity", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => FormQuestion_1.FormQuestion, question => question.form, { cascade: true }),
    __metadata("design:type", Object)
], Form.prototype, "questions", void 0);
exports.Form = Form = __decorate([
    (0, typeorm_1.Entity)()
], Form);
//# sourceMappingURL=Form.js.map