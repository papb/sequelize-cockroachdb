// Copyright 2021 The Cockroach Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied. See the License for the specific language governing
// permissions and limitations under the License.

require('./helper');

const { expect } = require('chai');
const { Sequelize, DataTypes } = require('../source');

describe('QueryInterface', () => {
  beforeEach(function() {
    this.sequelize.options.quoteIdenifiers = true;
    this.queryInterface = this.sequelize.getQueryInterface();
  });

  afterEach(async function() {
    this.queryInterface.dropTable('menus');
  });

  describe('dropEnum', () => {
    beforeEach(async function() {
      await this.queryInterface.createTable('menus', {
        structuretype: DataTypes.ENUM('menus', 'submenu', 'routine'),
        sequence: DataTypes.INTEGER,
        name: DataTypes.STRING
      });
    });

    it('should be able to drop the specified column', async function() {
      await this.queryInterface.removeColumn('menus', 'structuretype');
      const enumList0 = await this.queryInterface.pgListEnums('menus');

      expect(enumList0).to.have.lengthOf(1);
      expect(enumList0[0]).to.have.property('enum_name').and.to.equal('enum_menus_structuretype');
    });

    it('should be able to drop the specified enum', async function() {
      await this.queryInterface.dropEnum('enum_menus_structuretype');
      await this.queryInterface.dropEnum('enum_bars_enum');
      const enumList = await this.queryInterface.pgListEnums('menus');

      expect(enumList).to.be.an('array');
      expect(enumList).to.have.lengthOf(0);
    });
  });
});
