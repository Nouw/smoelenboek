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
exports.Category = exports.CategoryType = void 0;
const typeorm_1 = require("typeorm");
const File_1 = require("./File");
var CategoryType;
(function (CategoryType) {
    CategoryType["CATEGORY_TYPE_DOCUMENTS"] = "documents";
    CategoryType["CATEGORY_TYPE_PHOTOS"] = "photos";
})(CategoryType || (exports.CategoryType = CategoryType = {}));
let Category = exports.Category = class Category {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Category.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Category.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        default: false
    }),
    __metadata("design:type", Boolean)
], Category.prototype, "pinned", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: CategoryType,
        default: CategoryType.CATEGORY_TYPE_PHOTOS
    }),
    __metadata("design:type", String)
], Category.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], Category.prototype, "created", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => File_1.File, file => file.category),
    __metadata("design:type", Object)
], Category.prototype, "files", void 0);
exports.Category = Category = __decorate([
    (0, typeorm_1.Entity)()
], Category);
//# sourceMappingURL=Category.js.map