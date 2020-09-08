'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    static associate(models) {
		Course.belongsTo(models.User, {
			foreignKey: {
				fieldName: 'userId',
				allowNull: false
			}
		});
    }
  };
  Course.init({
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please enter a title'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please enter a description'
      }
    }
  },
  estimatedTime: DataTypes.STRING,
  materialsNeeded: DataTypes.STRING
}
  , {
    sequelize,
    modelName: 'Course',
  });
  return Course;
};