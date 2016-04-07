# This migration comes from doodle (originally 20160320142137)
class CreateDoodleUsers < ActiveRecord::Migration
  def change
    create_table :doodle_users do |t|
      t.string :login
      t.string :pass
      t.string :type

      t.timestamps null: false
    end
  end
end
